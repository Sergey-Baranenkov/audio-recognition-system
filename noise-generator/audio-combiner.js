import child_process from 'child_process'

export default {
    soxPath: 'sox',

    combineSamples: function (file_1, file_2, outName, next) {

        var command = this.soxPath +
            ' ' + '-m' +
            ' ' + file_1 +
            ' ' + file_2 +
            ' ' + outName + ' norm';

        child_process.exec(command, function (err, stdout, stderr) {
            next(err);
        });
    }

};
