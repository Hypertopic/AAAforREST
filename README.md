AAAforREST
==========

An HTTP reverse proxy to bring authentication, authorization and accounting to RESTful applications.

Contact: aurelien.benel@utt.fr

Home page: https://github.com/Hypertopic/AAAforREST


## Features

- Authentication
    - Frontend
        - HTTP basic
        - Cookie authentication
    - Backend
        - LDAP users
        - CouchDB users
- Authorization
    - POST, PUT, DELETE require authenticated users
    - more specific rules can be implemented on the backend
- Accounting
    - Log format can be configured
