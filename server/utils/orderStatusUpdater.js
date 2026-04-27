const appendOrderTimeline = (order, status, userId, note = "") => {
  order.status = status;
  order.timeline.push({
    status,
    note,
    updatedBy: userId,
    updatedAt: new Date()
  });
};

module.exports = appendOrderTimeline;
