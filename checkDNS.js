const dns = require('dns');
const options = {
  family: 4,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

const checkDNS = async (domain) => {
  try {
    // lookup domain and check if it's valid
    const result = await new Promise((resolve, reject) => {
      dns.lookup(domain, options, (err, address, family) => {
        if (err) {
        //   reject(false);
          return false;
        } else {
        //   resolve(domain);
            return true;
        }
      });
    });
    return result;
  } catch (error) {
    console.log(`Error checking domain: ${error}`);
    return false;
  }
};

module.exports = checkDNS;