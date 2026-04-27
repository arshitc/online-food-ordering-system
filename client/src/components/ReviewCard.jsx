const ReviewCard = ({ review }) => (
  <article className="card review-card">
    <div className="card-body">
      <h4>{review.customerId?.name || "Customer"}</h4>
      <p>Rating: {review.rating} / 5</p>
      <p>{review.comment}</p>
    </div>
  </article>
);

export default ReviewCard;
