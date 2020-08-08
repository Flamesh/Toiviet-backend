const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");


const TypeSchema = new mongoose.Schema ({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
    }
})

TypeSchema.plugin(uniqueValidator, {message: 'Đã có loại bài trên'})

mongoose.model('Type', TypeSchema)

exports.TypeSchema  = TypeSchema