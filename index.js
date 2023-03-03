#!/usr/bin/env node
var axios = require('axios');
var snakeCase = require('snake-case');
var Table = require('cli-table3');
var colors = require('colors/safe');
const moment = require('moment-timezone').default || require('moment-timezone');

const _toSnakeCase = (res) => {
    const keys = Object.keys(res);
    const changed = {};
    for (const k of keys) {
        changed[snakeCase.snakeCase(k)] = res[k];
    }
    return changed;
};

const toSnakeCase = (responses) => {
    if (!Array.isArray(responses)) {
        return _toSnakeCase(responses);
    }
    const transformed = [];
    for (const res of responses) {
        transformed.push(_toSnakeCase(res));
    }
    return transformed;
};

const printSimpleAllocation = (allocation, events) => {
    //print a table in the console to see the events
    // have the keys in columns
    // have the values in rows, the first column is comment

    events.sort((a, b) => {
        const diff = moment(a.start_date).diff(moment(b.start_date));
        if (diff === 0) {
            return moment(a.created_at).diff(moment(b.created_at));
        }
        return diff;
    });

    //print a table in the console to see the allocation
    // have the date in columns
    // have the location in rows
    // have a in the cell if the location is allocated for that date
    // have a blank cell if the location is not allocated for that date
    var table = new Table({});

    //filter unique locations
    const locations = allocation.map((a) => a.locationId).filter((v, i, a) => a.indexOf(v) === i);

    const dates = allocation.map((a) => a.date).filter((v, i, a) => a.indexOf(v) === i);
    const header = [''].concat(dates.map((d) => new Date(d).toISOString().slice(8, 13)));
    table.push(header);
    locations.forEach((l) => {
        // find the events that contribute to the location
        const row = [`${l}`].concat(
            dates.map((d) =>
                allocation.find((a) => `${a.locationId}` === `${l}` && a.date === d)
                    ? `${
                          events.find((o) => !o.invalid && allocation.find((u) => u.date === d)?.eventsIds[0] === o.id)?.id ??
                          events.find((o) => !o.invalid && allocation.find((u) => u.date === d)?.eventsIds[0] === o.id)?.id ??
                          ''
                      }`
                    : '',
            ),
        );
        table.push(row);
    });
    console.log(table.toString());
};

function printSimpleEventsTable(events) {
    events.sort((a, b) => {
        const diff = moment(a.start_date).diff(moment(b.start_date));
        if (diff === 0) {
            return moment(a.created_at).diff(moment(b.created_at));
        }
        return diff;
    });

    var table1 = new Table({});
    const header1 = [
        'id',
        'unit_id',
        'comment',
        'created_at',
        'start_date',
        'end_date',
        'start_location_id',
        'end_location_id',
        'is_blocking',
        'invalid',
        'invalid_reason',
    ];
    table1.push(header1);
    events.forEach((e) => {
        const row = header1.map((h) => {
            let val = e[h];
            if (val instanceof Date) {
                val = val.toISOString().slice(5, 13);
            }
            if (e.invalid) return colors.red(`${val}`.slice(0, 13));
            return `${val}`.slice(0, 13);
        });

        table1.push(row);
    });
    console.debug(table1.toString());
}

function printSimpleUnitTable(unit) {
    var table1 = new Table({});
    const header1 = ['id', 'name', 'productId', 'tenantId'];
    table1.push(header1);
    const row = header1.map((h) => {
        let val = unit[h];
        if (val instanceof Date) {
            val = val.toISOString().slice(5, 13);
        }
        return `${val}`;
    });

    table1.push(row);
    console.debug(table1.toString());
}

const init = async () => {
    //set vairable url with the first argument froin the command line
    const url = process.argv[2];
    //get allocatio from the url using fetch
    const response = await axios.get(url);
    const data = response.data.data;
    const allocations = data;
    for (const allocation of allocations) {
        console.debug(`\n\n\n Unit ${allocation.unit.id}`);
        printSimpleUnitTable(allocation.unit);
        printSimpleEventsTable(toSnakeCase(allocation.events));
        printSimpleAllocation(allocation.allocations, toSnakeCase(allocation.events));
    }
};

init();
