/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @author Gyandeep Singh (@gyandeeps)
 * @license Apache-2.0
 */

const configName = 'triage.yml'

/**
 * Returns the triage label reading it from the settings.
 *
 * @param   {Object} `context` Probot webhook event context
 * @returns {Promise} A Promise that fulfills with the label when the action is complete
 */
async function triageLabel (context) {
  const config = await context.config(configName)
  const { label } = config
  return label || 'triage'
}

/**
 * Returns whether the triage labeling is enabled or not.
 *
 * @param   {Object} `context` Probot webhook event context
 * @returns {Promise} A Promise that fulfills with the enabled value when the action is complete
 */
async function enabled (context) {
  const config = await context.config(configName)
  return config.enabled === true
}

/**
 * Adds the triage label if the issue has no labels on it.
 *
 * @param   {Object} `context` Probot webhook event context
 * @returns {Promise} A Promise that fulfills when the action is complete
 * @private
 */

async function triage (context) {
  const { payload, github } = context
  if (!(await enabled(context))) {
    return
  }
  if (!payload.issue || payload.issue.labels.length === 0) {
    /*
     * Fetch the issue again to double-check that it has no labels.
     * Sometimes, when an issue is opened with labels, the initial
     * webhook event contains no labels.
     * https://github.com/eslint/eslint-github-bot/issues/38
     */
    const issue = await github.issues.get(context.issue()).then((res) => res.data)

    if (issue.labels.length === 0) {
      const label = await triageLabel(context)
      await github.issues.addLabels(context.issue({ labels: [label] }))
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
  if (!(await enabled(context))) {
    return
  }
  const label = await triageLabel(context)
  if (payload.label && payload.label.name !== label) {
    await github.issues.removeLabel(context.issue({ name: label }))
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
