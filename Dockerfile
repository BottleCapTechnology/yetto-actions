FROM node:12-slim

LABEL "com.github.actions.name"="Yetto Actions"
LABEL "com.github.actions.description"="A Yetto integration with GitHub Actions"
LABEL "com.github.actions.icon"="user-check"
LABEL "com.github.actions.color"="purple"
LABEL "repository"="https://github.com/bottlecaptechnology/yetto-actions"
LABEL "homepage"="https://github.com/bottlecaptechnology/yetto-actions"
LABEL "maintainer"="Bottle Cap Technology"

COPY . .

RUN npm install --production

ENTRYPOINT ["node", "/main.js"]
