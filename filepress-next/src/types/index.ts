export interface Library {
  appid: string;
  appname: string;
  appdesc: string;
  appico: string;
  uid: number;
  username: string;
  dateline: number;
  isopen: number;
  disp: number;
  filecount?: number;
}

export interface Resource {
  rid: string;
  name: string;
  ext: string;
  type: string;
  size: number;
  width: number;
  height: number;
  btime: number;
  mtime: number;
  dateline: number;
  hasthumb: number;
  grade: number;
  appid: string;
  desc?: string;
  duration?: number;
  colors?: string;
  shape?: string;
  link?: string;
}

export interface Folder {
  fid: string;
  pfid: string;
  fname: string;
  desc: string;
  appid: string;
  pathkey: string;
  filenum: number;
  disp: number;
  dateline: number;
  cover: string;
}

export interface Tag {
  tid: number;
  tagname: string;
  hots: number;
  initial: string;
  groupid?: string;
}

export interface TagGroup {
  cid: string;
  catname: string;
  pcid: string;
  disp: number;
}

export interface Share {
  id: number;
  title: string;
  filepath: string;
  appid: string;
  dateline: number;
  endtime: number;
  username: string;
  uid: number;
  status: number;
  count: number;
  downloads: number;
  views: number;
  stype: number;
}

export type ViewMode = "masonry" | "grid" | "list" | "detail";
export type SortField = "btime" | "mtime" | "dateline" | "name" | "size";
export type SortOrder = "asc" | "desc";

export interface FilterState {
  keyword: string;
  ext: string;
  type: string;
  fid: string;
  tagId: string;
  sort: SortField;
  order: SortOrder;
}
