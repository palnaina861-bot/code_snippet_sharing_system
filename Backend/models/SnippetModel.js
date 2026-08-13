const { Schema, model } = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const snippetSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        required: true
    },
    // Language identifier used by Monaco Editor (e.g. 'javascript', 'python', 'typescript')
    language: {
        type: String,
        required: true,
        default: 'javascript',
        lowercase: true,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    folder: {
        type: Schema.Types.ObjectId,
        ref: 'folders',
        default: null
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: [Schema.Types.ObjectId],
        ref: 'users',
        default: []
    },
    // Unique token for public/shareable links (no auth required)
    shareToken: {
        type: String,
        unique: true,
        default: () => uuidv4()
    }
}, { timestamps: true });

module.exports = model('snippetsnew', snippetSchema);
