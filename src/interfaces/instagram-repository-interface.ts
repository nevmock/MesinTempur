// TODO: set return type
export default interface IInstagramRepository {
   getUserInfo(username: string): Promise<any>
   getUserFeeds(userId: string, cursor: string, pageSize: number): Promise<any>
   getPageInfo(shortcode: string): Promise<any>
   getUserStrories(userId: string): Promise<any>
   getUserHighlight(userId: string): Promise<any>
   getDetailUserHighlight(highlightId: string): Promise<any>
   getFollowers(userId: string, nextMaxId: string | null): Promise<any>
   getFollowing(userId: string, nextMaxId: string): Promise<any>
   getLikers(shortcode: string, untilPage: number): Promise<any>
   getPostByHashtag(tagName: string, cursor: string | null): Promise<any>
   getCommentList(shortcide: string, cursor: string | null): Promise<any>
   getReplyCommentList(commentId: string, cursor: string | null): Promise<any>
}