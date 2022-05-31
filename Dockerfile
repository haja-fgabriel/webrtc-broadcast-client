FROM node:16.15.0-slim

COPY . /root/app

RUN cd /root/app && npm install
