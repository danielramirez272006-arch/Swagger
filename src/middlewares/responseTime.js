function responseTime(req, res, next) {
  const start = process.hrtime.bigint();

  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const diff = Number(process.hrtime.bigint() - start) / 1e6;
    res.setHeader('X-Response-Time', `${diff.toFixed(2)}ms`);
    return originalWriteHead.apply(this, args);
  };

  next();
}

module.exports = responseTime;

