#!/bin/bash

docker exec cli peer chaincode install -n hdat -v 1 -p github.com/hdat
docker exec cli peer chaincode instantiate -n hdat -v 1 -C mychannel -c '{"Args":["a","100"]}' -P 'OR("Org1MSP.member")'

sleep 3