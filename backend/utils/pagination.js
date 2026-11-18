/**
 * Reusable Pagination Helper for Mongoose Queries
 */
const getPagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    totalItems,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

module.exports = {
  getPagination,
  getPaginationMeta
};
