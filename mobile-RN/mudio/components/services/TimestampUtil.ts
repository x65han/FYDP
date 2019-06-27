class TimestampUtil {
    public generateTimestamp() {
        const d = new Date();
        const year: String = d.getFullYear().toString();
        let month = (d.getMonth() + 1).toString();
        let day = d.getDate().toString();
        let hour = d.getHours().toString();
        let minute = d.getMinutes().toString();
        let second = d.getSeconds().toString();
        let mili = d.getMilliseconds().toString();
        //Space Filling
        month = (month.length == 1) ? '0' + month : month;
        day = (day.length == 1) ? '0' + day : day;
        hour = (hour.length == 1) ? '0' + hour : hour;
        minute = (minute.length == 1) ? '0' + minute : minute;
        second = (second.length == 1) ? '0' + second : second;
        mili = (mili.length == 1) ? '00' + mili : mili;
        mili = (mili.length == 2) ? '0' + mili : mili;
        // console.log(year);console.log(month);console.log(day);console.log(hour);console.log(minute);console.log(second);console.log(mili);
        return year + month + day + hour + minute + second + mili;
    }
}

export default new TimestampUtil()
