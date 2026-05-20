import { type ActiveStudyDestination, type StudyDestinationKind } from '../types.ts';

interface StudyDestinationResolverInput {
  destination: ActiveStudyDestination;
  validRoots: readonly string[];
  subtopicsByRoot: Record<string, Array<{ id: string }>>;
  isValidItemId: (itemId?: string) => boolean;
  isGovernancePendingItemId?: (itemId?: string) => boolean;
  resolveItemLocation?: (
    itemId: string
  ) => {
    majorTopicId?: string;
    subtopicId?: string;
  } | null;
}

export interface ResolvedStudyDestination {
  destination: ActiveStudyDestination;
  renderedKind: StudyDestinationKind;
  resolved: boolean;
  governancePending: boolean;
}

const hasMatchingRoot = (destination: ActiveStudyDestination, validRoots: readonly string[]) =>
  Boolean(destination.majorTopicId && validRoots.includes(destination.majorTopicId));

const hasMatchingSubtopic = (
  destination: ActiveStudyDestination,
  subtopicsByRoot: Record<string, Array<{ id: string }>>
) => {
  if (!destination.majorTopicId || !destination.subtopicId) {
    return false;
  }
  return (subtopicsByRoot[destination.majorTopicId] ?? []).some((entry) => entry.id === destination.subtopicId);
};

export const resolveStudyDestinationForRender = ({
  destination,
  validRoots,
  subtopicsByRoot,
  isValidItemId,
  isGovernancePendingItemId,
  resolveItemLocation,
}: StudyDestinationResolverInput): ResolvedStudyDestination => {
  if (destination.kind === 'landing') {
    return {
      destination: {
        ...destination,
        majorTopicId: undefined,
        subtopicId: undefined,
        itemId: undefined,
      },
      renderedKind: 'landing',
      resolved: false,
      governancePending: false,
    };
  }

  if (destination.kind === 'item_detail' && isGovernancePendingItemId?.(destination.itemId)) {
    return {
      destination,
      renderedKind: 'item_detail',
      resolved: false,
      governancePending: true,
    };
  }

  if (!hasMatchingRoot(destination, validRoots)) {
    return {
      destination: {
        ...destination,
        kind: 'landing',
        majorTopicId: undefined,
        subtopicId: undefined,
        itemId: undefined,
      },
      renderedKind: 'landing',
      resolved: true,
      governancePending: false,
    };
  }

  if (destination.kind === 'topic_overview') {
    return {
      destination: {
        ...destination,
        subtopicId: undefined,
      },
      renderedKind: 'topic_overview',
      resolved: false,
      governancePending: false,
    };
  }

  if (destination.kind === 'subtopic_overview') {
    if (!destination.subtopicId || !hasMatchingSubtopic(destination, subtopicsByRoot)) {
      return {
        destination: {
          ...destination,
          kind: 'topic_overview',
          subtopicId: undefined,
          itemId: undefined,
        },
        renderedKind: 'topic_overview',
        resolved: true,
        governancePending: false,
      };
    }
    return {
      destination,
      renderedKind: 'subtopic_overview',
      resolved: false,
      governancePending: false,
    };
  }

  if (destination.kind === 'item_detail' && !isValidItemId(destination.itemId)) {
    if (
      destination.subtopicId &&
      hasMatchingSubtopic(destination, subtopicsByRoot)
    ) {
      return {
        destination: {
          ...destination,
          kind: 'subtopic_overview',
          itemId: undefined,
        },
        renderedKind: 'subtopic_overview',
        resolved: true,
        governancePending: false,
      };
    }

    return {
      destination: {
        ...destination,
        kind: 'topic_overview',
        itemId: undefined,
      },
      renderedKind: 'topic_overview',
      resolved: true,
      governancePending: false,
    };
  }

  if (destination.kind === 'item_detail' && isValidItemId(destination.itemId)) {
    const resolvedLocation = destination.itemId ? resolveItemLocation?.(destination.itemId) : null;
    const normalizedDestination = resolvedLocation
      ? {
          ...destination,
          majorTopicId: resolvedLocation.majorTopicId ?? destination.majorTopicId,
          subtopicId: resolvedLocation.subtopicId ?? destination.subtopicId,
        }
      : destination;

    return {
      destination: normalizedDestination,
      renderedKind: 'item_detail',
      resolved: normalizedDestination !== destination,
      governancePending: false,
    };
  }

  return {
    destination,
    renderedKind: 'landing',
    resolved: true,
    governancePending: false,
  };
};
