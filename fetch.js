const fs = require("fs");
const https = require("https");
const process = require("process");
require("dotenv").config();

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const USE_GITHUB_DATA = process.env.USE_GITHUB_DATA;
const MEDIUM_USERNAME = process.env.MEDIUM_USERNAME;

const ERR = {
  noUserName:
    "GitHub username was not defined. Please set all relevant environment variables.",
  requestFailed:
    "The request to GitHub didn't succeed. Check if the GitHub token in your .env file is correct.",
  requestMediumFailed:
    "The request to Medium didn't succeed. Check if the Medium username in your .env file is correct.",
};

if (USE_GITHUB_DATA === "true") {
  if (GITHUB_USERNAME === undefined) {
    throw new Error(ERR.noUserName);
  }

  console.log(`Fetching profile data for ${GITHUB_USERNAME}`);
  var data = JSON.stringify({
    query: `
      {
        user(login: "${GITHUB_USERNAME}") {
          name
          bio
          avatarUrl
          location
          pinnedItems(first: 6, types: [REPOSITORY]) {
            totalCount
            edges {
              node {
                ... on Repository {
                  name
                  description
                  forkCount
                  stargazers {
                    totalCount
                  }
                  url
                  id
                  diskUsage
                  primaryLanguage {
                    name
                    color
                  }
                }
              }
            }
          }
        }
      }
    `,
  });

  const options = {
    hostname: "api.github.com",
    path: "/graphql",
    port: 443,
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "Node",
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  const req = https.request(options, (res) => {
    let responseData = "";

    console.log(`statusCode: ${res.statusCode}`);
    if (res.statusCode !== 200) {
      throw new Error(ERR.requestFailed);
    }

    res.on("data", (chunk) => {
      responseData += chunk;
    });

    res.on("end", () => {
      fs.writeFile("./public/profile.json", responseData, (err) => {
        if (err) {
          return console.log(err);
        }
        console.log("Saved file to public/profile.json");
      });
    });
  });

  req.on("error", (error) => {
    throw error;
  });

  req.write(data);
  req.end();
}

if (MEDIUM_USERNAME !== undefined) {
  console.log(`Fetching Medium blogs data for ${MEDIUM_USERNAME}`);
  const options = {
    hostname: "api.rss2json.com",
    path: `/v1/api.json?rss_url=https://medium.com/feed/@${MEDIUM_USERNAME}`,
    port: 443,
    method: "GET",
  };

  const req = https.request(options, (res) => {
    let mediumData = "";

    console.log(`statusCode: ${res.statusCode}`);
    if (res.statusCode !== 200) {
      throw new Error(ERR.requestMediumFailed);
    }

    res.on("data", (chunk) => {
      mediumData += chunk;
    });

    res.on("end", () => {
      fs.writeFile("./public/blogs.json", mediumData, (err) => {
        if (err) {
          return console.log(err);
        }
        console.log("Saved file to public/blogs.json");
      });
    });
  });

  req.on("error", (error) => {
    throw error;
  });

  req.end();
}
