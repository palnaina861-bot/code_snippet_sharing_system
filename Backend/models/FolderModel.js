const { Schema, model } = require('mongoose');

const folderSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    // Accent color for UI display (hex or named color)
    color: {
        type: String,
        default: '#6366f1'
    },
    icon: {
        type: String,
        default: 'folder'
    }
}, { timestamps: true });

module.exports = model('folders', folderSchema);
