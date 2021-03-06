import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import Sequences from '../../lib/collections/sequences/collection';
import classNames from 'classnames';

// Share styles with SequencesGrid
import { styles } from './SequencesGrid';

const SequencesGridWrapper = ({
  terms,
  className,
  classes,
  showLoadMore = false,
  showAuthor = false,
}: {
  terms: any,
  className?: string,
  classes: ClassesType,
  showLoadMore?: boolean,
  showAuthor?: boolean,
}) => {
  const { results, loading, count, totalCount, loadMore, loadingMore } = useMulti({
    terms,
    collection: Sequences,
    fragmentName: 'SequencesPageFragment',
    enableTotal: true,
    ssr: true
  });
  
  if (results && results.length) {
    return (<div className={classNames(className, classes.gridWrapper)}>
      <Components.SequencesGrid sequences={results} showAuthor={showAuthor} />
      { showLoadMore && totalCount! > count! &&
          <div className={classes.loadMore}>
            <Components.LoadMore loading={loadingMore} loadMore={loadMore} count={count} totalCount={totalCount} />
          </div>
      }
    </div>);
  } else if (loading) {
    return (<div className={classNames(className, classes.grid)}>
      <Components.Loading/>
    </div>);
  } else {
    // TODO: Replace with SequencesNoResults
    return (<div className={classNames(className, classes.grid)}>
      <div className={classes.gridContent}>
        <Components.PostsNoResults/>
      </div>
    </div>);
  }
};

const SequencesGridWrapperComponent = registerComponent('SequencesGridWrapper', SequencesGridWrapper, {styles});

declare global {
  interface ComponentTypes {
    SequencesGridWrapper: typeof SequencesGridWrapperComponent
  }
}

