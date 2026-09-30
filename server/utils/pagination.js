const getPagination = (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const createPaginationResponse = ({ data, page, limit, total }) => ({
  data,
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = { getPagination, createPaginationResponse };
