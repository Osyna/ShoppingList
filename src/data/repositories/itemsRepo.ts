import { pb } from '../../pb'
import type { Item } from '../../types'
import { escapeFilterValue } from '../../utils/pbFilter'
import type { RealtimeHandler, Unsubscribe } from './types'

const coll = () => pb.collection('items')

export type ItemCreatePayload = Omit<
  Item,
  'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'
>

export const itemsRepo = {
  async getForList(listId: string): Promise<Item[]> {
    return coll().getFullList<Item>({
      filter: `list = "${escapeFilterValue(listId)}"`,
      sort: 'checked,created',
    })
  },

  async create(payload: ItemCreatePayload): Promise<Item> {
    return coll().create<Item>(payload as never)
  },

  async update(id: string, patch: Partial<Item>): Promise<Item> {
    return coll().update<Item>(id, patch as never)
  },

  /**
   * Same as update but attaches a dedupe key so abortable taps coalesce.
   * Used by the toggle flow where rapid checks can race.
   */
  async updateCoalesced(id: string, patch: Partial<Item>, requestKey: string): Promise<Item> {
    return coll().update<Item>(id, patch as never, { requestKey })
  },

  async setChecked(id: string, checked: boolean): Promise<void> {
    await coll().update(id, { checked })
  },

  async remove(id: string): Promise<void> {
    await coll().delete(id)
  },

  /**
   * Subscribes to all item events, but only forwards those matching `listId`.
   * Returns an unsubscriber; the caller is responsible for invoking it before
   * calling `subscribeForList` again with a different list id.
   */
  async subscribeForList(
    listId: string,
    handler: RealtimeHandler<Item>
  ): Promise<Unsubscribe> {
    await coll().subscribe<Item>('*', (e) => {
      if (e.record.list !== listId) return
      handler({ action: e.action as 'create' | 'update' | 'delete', record: e.record })
    })
    return () => coll().unsubscribe('*')
  },
}
