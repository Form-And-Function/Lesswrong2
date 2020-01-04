import React from 'react';
import { withList, Components, registerComponent} from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from '../../lib/modules/utils/unflatten';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginTop: 12,
    marginBottom: 4
  }
})

const PostReviewsAndNominations = ({ classes, title, loading, results, post }) => {

  const { Loading, CommentsList } = Components

  

  if (!loading && results && !results.length) {
    return null
  } 
  
  const lastCommentId = results && results[0]?._id
  const nestedComments = unflattenComments(results);
  return (
    <div>
      {title && <div className={classes.title}>{title} for {post.title}</div>}
      <CommentsList
        comments={nestedComments}
        startThreadTruncated={true}
        post={post}
        lastCommentId={lastCommentId}
        forceSingleLine
        hideSingleLineMeta
      />
      {loading && <Loading/>}
    </div>
  );
};

const options = {
  collection: Comments,
  queryName: 'PostsItemNewCommentsThreadQuery',
  fragmentName: 'CommentsList',
  fetchPolicy: 'cache-and-network',
  limit: 5,
  // enableTotal: false,
};

registerComponent('PostReviewsAndNominations', PostReviewsAndNominations, [withList, options], withStyles(styles, {name:"PostReviewsAndNominations"}));
