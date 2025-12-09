// Jira Cloud REST API v3 Client

const JIRA_BASE_URL = process.env.JIRA_BASE_URL!;
const JIRA_EMAIL = process.env.JIRA_EMAIL!;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN!;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY!;
const JIRA_LABEL = process.env.JIRA_LABEL!;

// Base64 encode credentials for Basic Auth
const getAuthHeader = () => {
  const credentials = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString(
    "base64"
  );
  return `Basic ${credentials}`;
};

// Common headers for all requests
const getHeaders = () => ({
  Authorization: getAuthHeader(),
  Accept: "application/json",
  "Content-Type": "application/json",
});

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: {
      type: string;
      version: number;
      content: Array<{
        type: string;
        content?: Array<{
          type: string;
          text?: string;
        }>;
      }>;
    };
    status: {
      name: string;
      statusCategory: {
        name: string;
        colorName: string;
      };
    };
    priority: {
      name: string;
      iconUrl: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    labels: string[];
  };
}

export interface JiraTransition {
  id: string;
  name: string;
  to: {
    name: string;
    statusCategory: {
      key: string;
      name: string;
    };
  };
}

export interface CreateIssueParams {
  summary: string;
  description?: string;
  priority?: string;
}

/**
 * Create a new Jira issue with the tracker label
 */
export async function createJiraIssue(
  params: CreateIssueParams
): Promise<JiraIssue> {
  const { summary, description, priority = "Medium" } = params;

  const body = {
    fields: {
      project: { key: JIRA_PROJECT_KEY },
      summary,
      description: description
        ? {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: description,
                  },
                ],
              },
            ],
          }
        : undefined,
      issuetype: { name: "Task" },
      priority: { name: priority },
      labels: [JIRA_LABEL],
    },
  };

  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Jira issue: ${error}`);
  }

  const created = await response.json();

  // Fetch the full issue details
  return getJiraIssue(created.key);
}

/**
 * Get a single Jira issue by key
 */
export async function getJiraIssue(issueKey: string): Promise<JiraIssue> {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Jira issue: ${error}`);
  }

  return response.json();
}

/**
 * Search for issues with our tracker label
 */
export async function searchTrackedIssues(): Promise<JiraIssue[]> {
  const jql = `project = ${JIRA_PROJECT_KEY} AND labels = "${JIRA_LABEL}" ORDER BY created DESC`;

  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/search/jql`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        jql,
        fields: ["summary", "description", "status", "priority", "assignee", "created", "updated", "labels"],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to search Jira issues: ${error}`);
  }

  const data = await response.json();
  return data.issues || [];
}

/**
 * Get available transitions for an issue
 */
export async function getIssueTransitions(
  issueKey: string
): Promise<JiraTransition[]> {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get transitions: ${error}`);
  }

  const data = await response.json();
  return data.transitions || [];
}

/**
 * Transition an issue to a new status
 */
export async function transitionIssue(
  issueKey: string,
  transitionId: string
): Promise<void> {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        transition: { id: transitionId },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to transition issue: ${error}`);
  }
}

/**
 * Helper to extract plain text description from Jira's ADF format
 */
export function extractDescriptionText(
  description: JiraIssue["fields"]["description"]
): string {
  if (!description || !description.content) return "";

  return description.content
    .map((block) => {
      if (block.content) {
        return block.content
          .map((item) => item.text || "")
          .filter(Boolean)
          .join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Get the Jira issue URL
 */
export function getJiraIssueUrl(issueKey: string): string {
  return `${JIRA_BASE_URL}/browse/${issueKey}`;
}

// ============================================================================
// Comments API
// ============================================================================

export interface JiraComment {
  id: string;
  body: {
    type: string;
    version: number;
    content: Array<{
      type: string;
      content?: Array<{
        type: string;
        text?: string;
      }>;
    }>;
  };
  author: {
    accountId: string;
    displayName: string;
    emailAddress?: string;
    avatarUrls: {
      "48x48": string;
      "24x24": string;
      "16x16": string;
      "32x32": string;
    };
  };
  created: string;
  updated: string;
}

export interface JiraCommentsResponse {
  startAt: number;
  maxResults: number;
  total: number;
  comments: JiraComment[];
}

/**
 * Get all comments for an issue
 */
export async function getIssueComments(
  issueKey: string
): Promise<JiraComment[]> {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/comment?orderBy=created`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch comments: ${error}`);
  }

  const data: JiraCommentsResponse = await response.json();
  return data.comments || [];
}

/**
 * Add a comment to an issue
 */
export async function addIssueComment(
  issueKey: string,
  body: string
): Promise<JiraComment> {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/comment`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: body,
                },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add comment: ${error}`);
  }

  return response.json();
}

/**
 * Update an existing comment
 */
export async function updateIssueComment(
  issueKey: string,
  commentId: string,
  body: string
): Promise<JiraComment> {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/comment/${commentId}`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: body,
                },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update comment: ${error}`);
  }

  return response.json();
}

/**
 * Delete a comment
 */
export async function deleteIssueComment(
  issueKey: string,
  commentId: string
): Promise<void> {
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/comment/${commentId}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete comment: ${error}`);
  }
}

/**
 * Extract plain text from Jira comment ADF body
 */
export function extractCommentText(body: JiraComment["body"]): string {
  if (!body || !body.content) return "";

  return body.content
    .map((block) => {
      if (block.content) {
        return block.content
          .map((item) => item.text || "")
          .filter(Boolean)
          .join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}
