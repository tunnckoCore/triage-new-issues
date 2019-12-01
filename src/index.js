/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @author Gyandeep Singh (@gyandeeps)
 * @license Apache-2.0
 */

const configName = 'triage.yml'
const defaultConfig = {
  enabled: false,
  label: 'triage',
  removeLabel: true
}

/**
 * Returns the bot configuration
 *
 * @param {Object} context - Probot webhook event context
 */
async function getConfig (context) {
  return context.config(configName, defaultConfig)
}

/**
 * @param {Object} issue - The issue to check
 * @param {Object} config - The bot config object
 * @returns {Boolean} true if the issue has one or more labels matching the pattern
 */
function matchesLabels (issue, config) {
  const { removeLabel } = config
  const labels = issue.labels.map((label) => label.name)
  if (removeLabel === true) {
    return labels.includes(config.label)
  }
  if (typeof removeLabel === 'string') {
    return labels.some((label) => new RegExp(removeLabel).test(label))
  }
  if (Array.isArray(removeLabel)) {
    return labels.some((label) => removeLabel.includes(label))
  }
  return false
}

/**
 * Adds the triage label if the issue has no matching labels on it.
 *
 * @param   {Object} `context` Probot webhook event context
 * @returns {Promise} A Promise that fulfills when the action is complete
 * @private
 */
async function triage (context) {
  const { payload, github } = context
  const config = await getConfig(context)
  if (!config.enabled) {
    return
  }
  if (!payload.issue || !matchesLabels(payload.issue, config)) {
    /*
     * Fetch the issue again to double-check that it has no labels.
     * Sometimes, when an issue is opened with labels, the initial
     * webhook event contains no labels.
     * https://github.com/eslint/eslint-github-bot/issues/38
     */
    const issue = await github.issues.get(context.issue()).then((res) => res.data)

    if (!matchesLabels(issue, config)) {
      await github.issues.addLabels(context.issue({ labels: [config.label] }))
    }
  }
}

/**
 * If the another label is attached then remove the `triage` label.
 *
 * @param   {Object} `context` Probot webhook event context
 * @returns {Promise} A Promise that fulfills when the action is complete
 * @private
 */
async function check (context) {
  const { payload, github } = context
  const config = await getConfig(context)
  if (!config.enabled) {
    return
  }
  if (matchesLabels(payload.issue, config)) {
    await github.issues.removeLabel(context.issue({ name: config.label }))
  }
}

/**
 * Add triage label when an issue is opened or reopened
 */

module.exports = (robot) => {
  robot.on('issues.opened', triage)
  robot.on('issues.labeled', check)
  robot.on('issues.reopened', triage)

  robot.on('pull_request.opened', triage)
  robot.on('pull_request.labeled', check)
  robot.on('pull_request.reopened', triage)
}
