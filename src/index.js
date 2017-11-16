/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @author Gyandeep Singh (@gyandeeps)
 * @license Apache-2.0
 */

/**
 * Adds the triage label if the issue has no labels on it.
 *
 * @param   {Object} `context` Probot webhook event context
 * @returns {Promise} A Promise that fulfills when the action is complete
 * @private
 */

async function triage (context) {
  const { payload, github } = context

  if (payload.issue.labels.length === 0) {
    /*
     * Fetch the issue again to double-check that it has no labels.
     * Sometimes, when an issue is opened with labels, the initial
     * webhook event contains no labels.
     * https://github.com/eslint/eslint-github-bot/issues/38
     */
    const issue = await github.issues.get(context.issue()).then((res) => res.data)

    if (issue.labels.length === 0) {
      await github.issues.addLabels(context.issue({ labels: ['triage'] }))
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

  if (payload.label.name !== 'triage') {
    await github.issues.removeLabel(context.issue({ name: 'triage' }))
  }
}

/**
 * Add triage label when an issue is opened or reopened
 */

module.exports = (robot) => {
  robot.on('issues.opened', triage)
  robot.on('issues.labeled', check)
  robot.on('issues.reopened', triage)
}
