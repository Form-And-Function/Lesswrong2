import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import React, { useState } from 'react';
import { withStyles, createStyles } from '@material-ui/core/styles'
import { truncate } from '../../lib/editor/ellipsize';
import withUser from "../common/withUser";
import { postHighlightStyles, commentBodyStyles } from '../../themes/stylePiping'
import { Posts } from '../../lib/collections/posts';
import Card from '@material-ui/core/Card';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper.jsx';

export const POST_PREVIEW_WIDTH = 400

const styles = createStyles(theme => ({
  root: {
    width: POST_PREVIEW_WIDTH,
    position: "relative",
    padding: theme.spacing.unit*1.5,
    paddingBottom: 0,
    '& img': {
      maxHeight: "200px"
    },
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
    '& .expand': {
      color: theme.palette.grey[600],
      fontSize: "1rem",
      cursor: "pointer"
    }
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  title: {
    marginBottom: -6,
  },
  tooltipInfo: {
    fontStyle: "italic",
    ...commentBodyStyles(theme),
    fontSize: "1.1rem",
    color: theme.palette.grey[600],
  },
  highlight: {
    ...postHighlightStyles(theme),
    marginTop: theme.spacing.unit*2.5,
    marginBottom: theme.spacing.unit*1.5,
    wordBreak: 'break-word',
    fontSize: "1.1rem",

    '& img': {
      display:"none"
    },
    '& h1': {
      fontSize: "1.2rem"
    },
    '& h2': {
      fontSize: "1.2rem"
    },
    '& h3': {
      fontSize: "1.1rem"
    },
    '& hr': {
      display: "none"
    }
  },
  commentIcon: {
    height: 15,
    width: 15,
    color: theme.palette.grey[400],
    position: "relative",
    top: 3,
    marginRight: 6,
    marginLeft: 12
  },
  comments: {
    [theme.breakpoints.up('sm')]: {
      float: "right"
    },
    [theme.breakpoints.down('xs')]: {
      display: "inline-block",
      marginRight: theme.spacing.unit*2,
    },
  },
  comment: {
    marginTop: theme.spacing.unit*1.5,
    marginLeft: -13,
    marginRight: -13,
    marginBottom: -9
  },
  bookmark: {
    marginTop: 3
  },
  continue: {
    marginTop: theme.spacing.unit,
    color: theme.palette.grey[500],
    ...postHighlightStyles(theme),
    fontSize: "1.1rem"
  }
}))

const metaName = getSetting('forumType') === 'EAForum' ? 'Community' : 'Meta'

const getPostCategory = (post) => {
  const categories: Array<string> = [];

  if (post.isEvent) categories.push(`Event`)
  if (post.curatedDate) categories.push(`Curated Post`)
  if (post.af) categories.push(`AI Alignment Forum Post`);
  if (post.meta) categories.push(`${metaName} Post`)
  if (post.frontpageDate && !post.curatedDate && !post.af) categories.push(`Frontpage Post`)

  if (categories.length > 0)
    return categories.join(', ');
  else
    return post.question ? `Question` : `Personal Blogpost`
}

const PostsPreviewTooltip = ({ showAllInfo, post, classes, comment }) => {
  const { PostsUserAndCoauthors, PostsTitle, ContentItemBody, CommentsNode, BookmarkButton } = Components

  const [expanded, setExpanded] = useState(false)

  if (!post) return null

  const { htmlHighlight = "" } = post.contents || {}

  const highlight = truncate(htmlHighlight, 85, "words", (showAllInfo ? `... <span class="expand">(more)</span>` : null))

  return <AnalyticsContext pageElementContext="hoverPreview">
      <Card className={classes.root}>
        <div className={classes.header}>
          <div>
            <div className={classes.title}>
              <PostsTitle post={post} tooltip={false} wrap showIcons={false} />
            </div>
            <div className={classes.tooltipInfo}>
              { !showAllInfo && getPostCategory(post)}
              { showAllInfo && post.user && <span>By <PostsUserAndCoauthors post={post} simple/></span>}
            </div>
          </div>
          { showAllInfo && <div className={classes.bookmark}>
            <BookmarkButton post={post} lighter/>
          </div>}
        </div>
        {comment
          ? <div className={classes.comment}>
              <CommentsNode
              truncated
              comment={comment}
              post={post}
              hoverPreview
              forceNotSingleLine
              hideReply
            /></div>
          : <div onClick={() => setExpanded(true)}>
              <ContentItemBody
                className={classes.highlight}
                dangerouslySetInnerHTML={{__html: expanded ? htmlHighlight : highlight}}
                description={`post ${post._id}`}
              />
              {expanded && <Link className={classes.continue} to={Posts.getPageUrl(post)}>(Continue Reading)</Link>}
            </div>
        }
    </Card>
  </AnalyticsContext>

}

const PostsPreviewTooltipComponent = registerComponent('PostsPreviewTooltip', PostsPreviewTooltip, withUser,
  withStyles(styles, { name: "PostsPreviewTooltip" })
);

declare global {
  interface ComponentTypes {
    PostsPreviewTooltip: typeof PostsPreviewTooltipComponent
  }
}
