const LDAP = require('ldapjs');
const memoize = require("memoizee");

let close = (ldap) => {
  if (ldap._socket) {
    ldap._socket.end()
  }
}

module.exports = class Ldap {

  constructor(settings) {
    this.url = settings.url;
    this.searchBase = settings.searchBase;
    this.searchFilter = settings.searchFilter;
  }

  /**
   * @return Promise
   * rejected if user does not exist,
   * false if password is bad,
   * true if user and password are OK.
   */
  searchAndBind = (user, password) => new Promise((resolve, reject) => {
    let query = {
      attributes: ['dn'],
      filter: this.searchFilter.replace(/{{.+}}/, user),
      scope: 'sub'
    };
    let ldap = LDAP.createClient({url: this.url});
    ldap.search(this.searchBase, query, (tcpError, res) => {
      if (tcpError) {
        close(ldap);
        reject('TCP error');
      } else {
        let dn;
        res.on('searchEntry', (entry) => {
          dn = entry._dn.toString();
        });
        res.on('end', () => {
          if (!dn) {
            close(ldap);
            reject('User not found');
          } else {
            ldap.bind(dn, password, (badPassword) => {
              close(ldap);
              resolve(!badPassword);
            });
          }
        });
      }
    });
  });

  cachedSearchAndBind = memoize(this.searchAndBind, { max: 25, promise: true });

}
