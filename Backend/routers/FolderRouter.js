const express = require('express');
const FolderModel = require('../models/FolderModel');
const SnippetModel = require('../models/SnippetModel');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/folder/create
// Create a new folder (auth required)
// ─────────────────────────────────────────────
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { name, description, isPublic, color, icon } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Folder name is required.' });
        }

        const folder = new FolderModel({
            name,
            description: description || '',
            owner: req.user._id,
            isPublic: isPublic !== undefined ? isPublic : false,
            color: color || '#6366f1',
            icon: icon || 'folder'
        });

        const saved = await folder.save();
        return res.status(201).json({ message: 'Folder created.', folder: saved });
    } catch (err) {
        console.error('Create folder error:', err);
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/folder/getall
// Get all folders owned by the current user (auth required)
// Includes snippet count for each folder
// ─────────────────────────────────────────────
router.get('/getall', authMiddleware, async (req, res) => {
    try {
        const folders = await FolderModel.find({ owner: req.user._id }).sort({ createdAt: -1 });

        // Attach snippet count to each folder
        const foldersWithCount = await Promise.all(
            folders.map(async (folder) => {
                const count = await SnippetModel.countDocuments({ folder: folder._id });
                return { ...folder.toObject(), snippetCount: count };
            })
        );

        return res.status(200).json({ folders: foldersWithCount });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/folder/getbyid/:id
// Get a single folder with its snippets (auth required)
// ─────────────────────────────────────────────
router.get('/getbyid/:id', authMiddleware, async (req, res) => {
    try {
        const folder = await FolderModel.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        if (!folder.isPublic && folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const snippets = await SnippetModel.find({ folder: folder._id })
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 });

        return res.status(200).json({ folder, snippets });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// PUT /api/folder/update/:id
// Update folder metadata (auth + owner check)
// ─────────────────────────────────────────────
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const folder = await FolderModel.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        if (folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own folders.' });
        }

        const { name, description, isPublic, color, icon } = req.body;

        const updates = {};
        if (name !== undefined)        updates.name = name;
        if (description !== undefined) updates.description = description;
        if (isPublic !== undefined)    updates.isPublic = isPublic;
        if (color !== undefined)       updates.color = color;
        if (icon !== undefined)        updates.icon = icon;

        const updated = await FolderModel.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );

        return res.status(200).json({ message: 'Folder updated.', folder: updated });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/folder/delete/:id
// Delete a folder (auth + owner check)
// Query param: ?deleteSnippets=true  → also deletes all snippets inside
// ─────────────────────────────────────────────
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const folder = await FolderModel.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        if (folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own folders.' });
        }

        const deleteSnippets = req.query.deleteSnippets === 'true';

        if (deleteSnippets) {
            // Hard delete all snippets inside
            await SnippetModel.deleteMany({ folder: folder._id });
        } else {
            // Un-assign snippets from the folder (orphan them)
            await SnippetModel.updateMany({ folder: folder._id }, { $set: { folder: null } });
        }

        await FolderModel.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: deleteSnippets
                ? 'Folder and all its snippets deleted.'
                : 'Folder deleted. Snippets have been unassigned.'
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
