FROM wechaty/wechaty

WORKDIR /bot

COPY package.json .
RUN jq 'del(.dependencies.wechaty)' package.json | sponge package.json \
    && npm install \
    && sudo rm -fr /tmp/* ~/.npm
COPY . .

CMD [ "npm", "start" ]
