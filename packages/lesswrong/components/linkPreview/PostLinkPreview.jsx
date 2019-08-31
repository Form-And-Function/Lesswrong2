import React from 'react';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';
import { usePostBySlug, usePostByLegacyId } from '../posts/usePost.js';
import { withStyles } from '@material-ui/core/styles';

const PostLinkPreview = ({href, targetLocation, innerHTML}) => {
  const postID = targetLocation.params._id;
  
  const { document: post, error } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
    
    documentId: postID,
  });
  
  return <Components.PostLinkPreviewWithPost post={post} error={error} href={href} innerHTML={innerHTML} />
}
registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewSequencePost = ({href, targetLocation, innerHTML}) => {
  const postID = targetLocation.params.postId;
  
  const { document: post, error } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
    
    documentId: postID,
  });
  
  return <Components.PostLinkPreviewWithPost post={post} error={error} href={href} innerHTML={innerHTML} />
}
registerComponent('PostLinkPreviewSequencePost', PostLinkPreviewSequencePost);

const PostLinkPreviewSlug = ({href, targetLocation, innerHTML}) => {
  const slug = targetLocation.params.slug;
  const { post, error } = usePostBySlug({ slug });
  
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} />
}
registerComponent('PostLinkPreviewSlug', PostLinkPreviewSlug);

const PostLinkPreviewLegacy = ({href, targetLocation, innerHTML}) => {
  const legacyId = targetLocation.params.id;
  const { post, error } = usePostByLegacyId({ legacyId });
  
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} />
}
registerComponent('PostLinkPreviewLegacy', PostLinkPreviewLegacy);

const postLinkPreviewWithPostStyles = theme => ({
  popper: {
    opacity: 1,
  },
  tooltip: {
    background: "none",
  }
})

const PostLinkPreviewWithPost = ({classes, href, innerHTML, post, error}) => {
  const { PostsItemTooltip } = Components
  const linkElement = <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>;
  if (!post) {
    return linkElement;
  }
  
  return (
    <Tooltip
      title={
        error
          ? error
          : <PostsItemTooltip post={post} showCategory showAuthor showKarma showComments showTitle wide truncateLimit={900}/>
      }
      classes={{tooltip:classes.tooltip, popper: classes.popper}}
      TransitionProps={{ timeout: 0 }}
      placement="bottom-start"
      enterDelay={0}
      PopperProps={{ style: { pointerEvents: 'none' } }}
    >
      {linkElement}
    </Tooltip>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost, withStyles(postLinkPreviewWithPostStyles, {name:"PostLinkPreviewWithPost"}));