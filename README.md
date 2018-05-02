e2e-dashboard-client
====================

Client library to send E2E reports to a dashboard service for visualization

## TODO

- DONE Reverse screenshot order (actually report app should order by time)
- DONE report-app: Filter by token and project
- DONE Add project id
- DONE Specify token for report data upload
- Show a url to the dashboard after test execution
- Speed up test import
- Extract User Agent info
- Extract tags from test title
- Implement element highlighting
- Test with real project
- Autowait for elements
- Implement scenario outline


## Usage with codeceptjs

Include it as helper in your codeceptjs project (see examples directory). Then run your tests
specifying the reporter host as environment variable, like so:

```
    cross-env TOKEN=12345 PROJECT=codeceptjs-demo DASHBOARD_HOST=localhost:8000 codeceptjs run
```