import timeAgo from 'node-time-ago';

class TimestampUtil {
    public generateTimestamp(random=false) {
        const d = random ? new Date(+(new Date()) - Math.floor(Math.random()*30000000000)) : new Date()
        const year: String = d.getFullYear().toString();
        let month = (d.getMonth() + 1).toString();
        let day = d.getDate().toString();
        let hour = d.getUTCHours().toString();
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

    private stringToDate(raw_time: string) {
        const year = raw_time.slice(0, 4)
        const month = raw_time.slice(4, 6)
        const day = raw_time.slice(6, 8)
        const hour = raw_time.slice(8, 10)
        const minute = raw_time.slice(10, 12)
        const second = raw_time.slice(12, 14)
        const mili = raw_time.slice(14)
        const formatted_string = `${year}-${month}-${day}T${hour}:${minute}:${second}.${mili}Z`
        return new Date(formatted_string)
    }

    public timeAgo(raw_time: string): string {
        const date = this.stringToDate(raw_time)
        return timeAgo(date)
    }
}

export default new TimestampUtil()
