interface TErrorInfo {
   usernameTarget: string;
   userId: string | null;
   cursor: string | null;
   commentCursor: string | null;
   replyCursor: string | null;
   problem: string;
   dateCriteria: any;
}

export default TErrorInfo;
