const delay = (time: number): any => {
   return new Promise((res) => setTimeout(res, time));
};

export default delay;
