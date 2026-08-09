const express = require('express');
const SnippetModel = require('../models/SnippetModel');
const FolderModel = require('../models/FolderModel');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/snippet/create
// Create a new snippet (auth required)
// ─────────────────────────────────────────────
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { title, description, code, language, tags, isPublic, folder } = req.body;

        if (!title || !code || !language) {
            return res.status(400).json({ message: 'Title, code, and language are required.' });
        }

        // If a folder is specified, verify the user owns it
        if (folder) {
            const folderDoc = await FolderModel.findById(folder);
            if (!folderDoc || folderDoc.owner.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Folder not found or access denied.' });
            }
        }

        const snippet = new SnippetModel({
            title,
            description: description || '',
            code,
            language: language.toLowerCase(),
            tags: tags || [],
            isPublic: isPublic !== undefined ? isPublic : true,
            author: req.user._id,
            folder: folder || null
        });

        const saved = await snippet.save();
        await saved.populate('author', 'name email avatar');

        // Emit live event to all clients watching this snippet's room
        const io = req.app.get('io');
        if (io) io.emit('snippet:created', saved);

        return res.status(201).json({ message: 'Snippet created.', snippet: saved });
    } catch (err) {
        console.error('Create snippet error:', err);
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/snippet/getall
// Get all public snippets (with optional search & filter)
// Query params: ?search=&language=&tag=&page=&limit=
// ─────────────────────────────────────────────
router.get('/getall', async (req, res) => {
    try {
        const { search, language, tag, page = 1, limit = 20 } = req.query;

        const query = { isPublic: true };

        if (language) query.language = language.toLowerCase();
        if (tag)      query.tags = { $in: [tag] };
        if (search)   query.$text = { $search: search };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [snippets, total] = await Promise.all([
            SnippetModel.find(query)
                .populate('author', 'name avatar')
                .populate('folder', 'name color')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            SnippetModel.countDocuments(query)
        ]);

        return res.status(200).json({
            snippets,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/snippet/getbyuser
// Get current user's own snippets (auth required)
// ─────────────────────────────────────────────
router.get('/getbyuser', authMiddleware, async (req, res) => {
    try {
        const snippets = await SnippetModel.find({ author: req.user._id })
            .populate('folder', 'name color icon')
            .sort({ createdAt: -1 });

        return res.status(200).json({ snippets });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/snippet/getbyfolder/:folderId
// Get snippets inside a specific folder (auth required)
// ─────────────────────────────────────────────
router.get('/getbyfolder/:folderId', authMiddleware, async (req, res) => {
    try {
        const folder = await FolderModel.findById(req.params.folderId);
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        // Allow access if owner OR folder is public
        if (!folder.isPublic && folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const snippets = await SnippetModel.find({ folder: req.params.folderId })
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 });

        return res.status(200).json({ folder, snippets });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/snippet/getbyid/:id
// Get a single snippet by ID (increments view count)
// ─────────────────────────────────────────────
router.get('/getbyid/:id', async (req, res) => {
    try {
        const snippet = await SnippetModel.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        )
        .populate('author', 'name email avatar')
        .populate('folder', 'name color icon');

        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }

        if (!snippet.isPublic) {
            return res.status(403).json({ message: 'This snippet is private.' });
        }

        return res.status(200).json({ snippet });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/snippet/share/:token
// Public share link — no auth required
// ─────────────────────────────────────────────
router.get('/share/:token', async (req, res) => {
    try {
        const snippet = await SnippetModel.findOneAndUpdate(
            { shareToken: req.params.token },
            { $inc: { views: 1 } },
            { new: true }
        ).populate('author', 'name avatar');

        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }

        return res.status(200).json({ snippet });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// PUT /api/snippet/update/:id
// Update a snippet (auth + owner check)
// Emits Socket.IO live update event
// ─────────────────────────────────────────────
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const snippet = await SnippetModel.findById(req.params.id);

        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }

        if (snippet.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own snippets.' });
        }

        const { title, description, code, language, tags, isPublic, folder } = req.body;

        const updates = {};
        if (title !== undefined)       updates.title = title;
        if (description !== undefined) updates.description = description;
        if (code !== undefined)        updates.code = code;
        if (language !== undefined)    updates.language = language.toLowerCase();
        if (tags !== undefined)        updates.tags = tags;
        if (isPublic !== undefined)    updates.isPublic = isPublic;
        if (folder !== undefined)      updates.folder = folder;

        const updated = await SnippetModel.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        )
        .populate('author', 'name email avatar')
        .populate('folder', 'name color');

        // Emit live update event to clients watching this snippet
        const io = req.app.get('io');
        if (io) {
            io.to(`snippet:${req.params.id}`).emit('snippet:updated', updated);
        }

        return res.status(200).json({ message: 'Snippet updated.', snippet: updated });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/snippet/delete/:id
// Delete a snippet (auth + owner check)
// ─────────────────────────────────────────────
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const snippet = await SnippetModel.findById(req.params.id);

        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }

        if (snippet.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own snippets.' });
        }

        await SnippetModel.findByIdAndDelete(req.params.id);

        const io = req.app.get('io');
        if (io) io.emit('snippet:deleted', { _id: req.params.id });

        return res.status(200).json({ message: 'Snippet deleted.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/snippet/like/:id
// Toggle like on a snippet (auth required)
// ─────────────────────────────────────────────
router.post('/like/:id', authMiddleware, async (req, res) => {
    try {
        const snippet = await SnippetModel.findById(req.params.id);

        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }

        const userId = req.user._id.toString();
        const alreadyLiked = snippet.likes.map(l => l.toString()).includes(userId);

        const update = alreadyLiked
            ? { $pull: { likes: req.user._id } }
            : { $addToSet: { likes: req.user._id } };

        const updated = await SnippetModel.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        return res.status(200).json({
            message: alreadyLiked ? 'Like removed.' : 'Snippet liked.',
            likes: updated.likes.length,
            liked: !alreadyLiked
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
