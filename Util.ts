module Util {

    declare let imports;

    const Lang = imports.lang;
    const GLib = imports.gi.GLib;

    export interface IURLArgs {
        [arg_name: string]: string|number;
    }

    export interface IGetJSONCallback {
        (response: any, err: Error): void
    }

    export function getJSON (url: string, args: IURLArgs, callback: IGetJSONCallback) {

        const Soup = imports.gi.Soup;
        const soup_session = new Soup.Session();

        function stringify_args (args: IURLArgs): string {
            let arg_str = '';
            arg_str += '?';
            let first_arg = true;
            for (let arg in args) {
                if (!first_arg) {
                    arg_str += '&';
                }
                first_arg = false;
                arg_str += (arg + '=' + args[arg]);
            }
            return arg_str;
        }

        let arg_str = '';
        if (args) {
            arg_str = stringify_args(args);
        }
        const request = Soup.Message.new('GET', url + arg_str);
        soup_session.queue_message(request, function (soup_session, message) {
            if (message.status_code !== 200) {
                callback(null, new Error("Request failed."));
            }
            let json_obj;
            try {
                json_obj = JSON.parse(message.response_body.data);
            } catch (e) {
                callback(null, new Error("Could not parse reply."));
                return;
            }
            callback(json_obj, null);
        });

    }


    // Calls callback repeatedly until it returns false.
    export function setInterval (callback: Function, interval: number) {
        GLib.timeout_add(1, interval, callback)
    }

}
