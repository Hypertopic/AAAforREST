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
    this.id = settings.searchFilter.match(/\w+/)[0];
  }

  /**
   * @return Promise
   * rejected if user does not exist,
   * false if password is bad,
   * true if user and password are OK.
   */
  searchAndBind = (user, password) => new Promise((resolve, reject) => {
    console.log('Real search for', user, password);
    let ldapUser = `${this.id}=${user},${this.searchBase}`;
    let ldap = LDAP.createClient({url: this.url});
    ldap.search(ldapUser, {}, (tcpError, res) => {
      if (tcpError) {
        close(ldap);
        reject('TCP error');
      } else {
        res.on('error', () => {
          close(ldap);
          reject('User not found');
        });
        res.on('searchEntry', () => {
          ldap.bind(ldapUser, password, (badPassword) => {
            close(ldap);
            resolve(!badPassword);
          });
        });
      }
    });
  });

  cachedSearchAndBind = memoize(this.searchAndBind, { max: 25, promise: true });

}
