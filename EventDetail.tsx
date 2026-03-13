// Assuming necessary imports here

const generateCoverImageUrl = (coverImage) => {
    const { data } = supabase.storage.from('restaurant-images').getPublicUrl(coverImage);
    return data.publicUrl || 'placeholder.svg';
};

const EventDetail = ({ event }) => {
    const coverImageUrl = generateCoverImageUrl(event.cover_image);
    return (
        <div>
            <img src={coverImageUrl} alt="Cover" style={{ width: '100%', height: 'auto' }} />
            {/* Other JSX content remains the same */}
        </div>
    );
};

export default EventDetail;