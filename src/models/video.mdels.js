import mongoose , {Schema , model} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-paginate-v2';
const videoSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    thumbnail: {
        type: String,  //from cloudinary
        required: true,
    },
    videoFile: {
        type: String,  //from cloudinary
        required: true,
    },
    Owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },

},{ timestamps: true });
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model('Video', videoSchema);