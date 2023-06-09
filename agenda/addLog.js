import { Logging, getInputMultilines } from "../helpers.js";
import { appendBlk, retrieveBlkChildren } from "../notion/index.js";
import { getNowStr } from "./helper.js";

const idMap = {
  sun: process.env.NOTION_AGENDA_SUN_BLK_ID,
  mon: process.env.NOTION_AGENDA_MON_BLK_ID,
  tue: process.env.NOTION_AGENDA_TUE_BLK_ID,
  wed: process.env.NOTION_AGENDA_WED_BLK_ID,
  thu: process.env.NOTION_AGENDA_THU_BLK_ID,
  fri: process.env.NOTION_AGENDA_FRI_BLK_ID,
  sat: process.env.NOTION_AGENDA_SAT_BLK_ID,
}

export const addLog = async (...args) => {
  const day = args.find(e => Object.keys(idMap).includes(e.toLowerCase()))?.toLowerCase()
  const today = day || new Date().toString().slice(0, 3).toLowerCase();
  const formattedDay = `${today.charAt(0).toUpperCase()}${today.slice(1).toLowerCase()}`;

  const content = await getInputMultilines("What have you accomplished?");

  Logging.warn(`Adding => ${formattedDay}...`);
  const dayBlkId = idMap[today];

  try {
    // retrieve id
    const { results: blkChildren } = await retrieveBlkChildren({
      block_id: dayBlkId,
    });
    const logBlk = blkChildren.find(blk => blk.toggle?.rich_text?.[0]?.plain_text === 'LOG' )
    if (!logBlk) {
      throw new Error("Cannot find LOG Block!")
    }
    
    const { id: blkId } = logBlk;
    const nowStr = getNowStr();

    const res = await appendBlk({
      block_id: blkId,
      children: [
        {
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: `${content}\n` || "" 
                }
              },
              { mention: { date: {
                    start: nowStr,
                    time_zone: "Asia/Hong_Kong",
              }}}
            ]
          }
        }
      ]
    })
    if (res?.results?.length) {
      Logging.success(`Succesfully inserted:\n${content} @${nowStr}`)
    }
  } catch (error) {
    Logging.error("Adding failed: ");
    console.error(error)
  } finally {
    process.exit(0)
  }
}
