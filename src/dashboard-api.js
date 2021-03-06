const assert = require('assert')
const fs = require('fs')
const rp = require('request-promise')
const debug = require('debug')('bifrost-io:dashboard-api')

const config = require('./config')

const HOST = process.env.DASHBOARD_HOST || config.dashboardHost
const PORT = process.env.DASHBOARD_PORT || config.dashboardPort || 8003

const UPLOAD_URL = `http://${HOST}:${PORT}/upload`;
const GETDASHBOARD_URL = `http://${HOST}:${PORT}/dashboard-url`;

const getDashboardUrl = async (ownerkey, project, runId) => {
    if (!HOST) return undefined

    assert(ownerkey, 'Expected an ownerkey')
    assert(project, 'Expected the test project name')
    assert(runId, 'Expected a test run id')

    const res = await rp.get(`${GETDASHBOARD_URL}/${ownerkey}/${project}/${runId}`)

    return JSON.parse(res)
}

const sendReport = async zipFileName => {
    assert(zipFileName, 'Expected a path to a zip file')

    debug('Uploading zipped report data', zipFileName)

    const formData = {
        report_data: fs.createReadStream(zipFileName)
    }

    await rp.post({url: UPLOAD_URL, formData})
    debug('Successfully uploaded zipped report data', zipFileName)
}

const isDashboardHostConfigured = () => HOST !== undefined

module.exports = {
    sendReport,
    isDashboardHostConfigured,
    getDashboardUrl
}
