import moment from 'moment/moment';

export const getDiffTime = (postTime: number, commentTime: number): string => {
   let m1 = moment(moment(postTime * 1000), 'DD-MM-YYYY HH:mm');
   let m2 = moment(moment(commentTime * 1000), 'DD-MM-YYYY HH:mm');
   let m3 = m2.diff(m1, 'minutes');
   let numdays = Math.floor(m3 / 1440);
   let numhours = Math.floor((m3 % 1440) / 60);
   let numminutes = Math.floor((m3 % 1440) % 60);
   return numdays + ' day(s) ' + numhours + 'h ' + numminutes + 'm';
};