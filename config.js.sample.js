module.exports={
'port':1337,
'sites':[{
    "hostProxy" : "acme.com", // name of the virtual server
	"host": "tex.avery.org", // name of the physical server
	"port": 7777, // port number of the physical server
	"path": "", // additional path information to access the physical server
    "logFile": "acme.log", // name of the log file
    "couchDBCompat":false, //if the proxy is used for CouchDB replication add nodejs version < 0.11.6
    "rewritePath": { // rewrite the hostProxy name inside the answer headers
      "enable":true,
      "headersOffset":0 // also remove "part" of the path information (a part is the string between two '/')
      },
    "hideAuth":true, // hide the authentication information inside the http headers of the request
    "ldap": { // LDAP server information
      "url": "ldap://ldap.acme.com",
      "id":"cn=", // how the user id is define in the request
      "cn":"dc=acme,dc=com" // other entries in the request
    },
    "restricted": { // information about resources with restricted access
      "rocket": ["will.coyote"], // "name_of_the_resource_inside_the_url": ["list", "of", "authorized", "users", "id"],
      "magnet": ["will.coyote"],
      "false hole": ["will.coyote"],
      "rifle": ["elmer.fudd"],
      "ammo": ["elmer.fudd"]
      },

    "rules":[    { // list rules that define the proxy behaviours for this server
          "control": function(context){ // define when this rules is trigged
	    return context.req.method != 'GET';
	  },
    action: function(context) { // what the proxy has to do
	    authenticate([ldap], context, function() {
	      AuthorizList(context, function() {
	        proxyWork(context);
	      });
	    })
    },
          "final": true // define if the proxy has to search for other relevents rules
          }]
  },
  {"hostProxy":"test.acme.shop.com",
  	"host": "tex.test.server.com",
  	"port": 1337,
  	"path": "/test/shop/acme/path",
    "logFile": "test_shop_acme.log",
    "rewritePath": {
      "enable":true,
      "headersOffset":0
      },
    "hideAuth":true,
    ldap: {
      url: "ldap://ldap.acme.com",
      id: "cn=",
      cn: "dc=acme,dc=com"
    },
    "authData": { // information for the dummy authentication
          "login": "roadrunner",
          "pw": "bipbip"
    },
    "rules": [{
          "control": "request.method != 'GET'",
    action: function(context) {
      authenticate([ldap, dummy], context, function() {
	      proxyWork(context);
      });
    },
          "final": true
          }]
  }
]
};
