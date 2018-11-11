'use strict';
let github = require('octonode');
const config = require('./config');

function isAPullRequest(body) {
  return body && ('pull_request' in body);
}

function hasAReference(body) {
  return body.pull_request.title.toLowerCase().startsWith('github issue');
}

function getRepoName(body) {
  if (body && body.repository && body.repository.full_name) {
    return body.repository.full_name;
  } else {
    return null;
  }
}

function getSHA(body) {
  if (body && body.pull_request && body.pull_request.head && body.pull_request.head.sha) {
    return body.pull_request.head.sha;
  } else {
    return null;
  }
}

module.exports.checker = async (event, context) => {
  let githubClient = github.client(config.github_token);

  const body = JSON.parse(event.body);
  console.log(body);

  if (isAPullRequest(body)) {
    const repoName = getRepoName(body);
    const sha = getSHA(body);
    const postURL = `/repos/${repoName}/statuses/${sha}`;
    let status = {};
    if (hasAReference(body)) {
      status = {
        state: 'success',
        description: 'PR Title includes issue',
        content: 'serverless-github/pr-title'        
      };
    } else {
      status = {
        state: 'failure',
        description: 'PR Title needs to reference issue',
        content: 'serverless-github/pr-title'        
      };
    }
    try {
      await githubClient.postAsync(postURL, status);
    } catch (err) {
      console.log(err);
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: body,
      input: event,
    }),
  };
};
