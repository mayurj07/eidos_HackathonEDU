#!/bin/bash


HOST_DIR=paragon:/data/hipergraph/

mkdir -p data

pushd data > /dev/null

mkdir -p geolite

pushd geolite > /dev/null

for name in hpg_geolite2_city_blocks_ipv4 hpg_zip2income; do
    if [ ! -f $name.tgz ]; then
	scp $HOST_DIR/$name.tgz .
	tar zxvf $name.tgz
	> $name.tgz
    fi
done;

popd > /dev/null

mkdir -p tsv2

pushd tsv2 > /dev/null

for name in stanford.tsv2; do
    if [ ! -f $name.tgz ]; then
	scp $HOST_DIR/$name.tgz .
	tar zxvf $name.tgz
	> $name.tgz
    fi
done;

popd > /dev/null

popd > /dev/null

sync && echo "Successfully fetched data."

exit 0