export const defaultCustomProps = [
  /*{
    value: 'row',
    label: 'Row'
  }, {
    value: 'seat',
    label: 'Seat'
  },{
    value: 'count',
    label: 'Tickets leave',
    type: 'number',
  },  {
    value: 'busyCount',
    label: 'Booking / Sold',
    type: 'number',
  },  {
    value: 'price',
    label: 'Price',
    type: 'number',
    groupEditable: true,
    system: true
  }, */ {
    value: 'icon',
    label: 'Seat icon',
    type: 'file',
    accept: '.svg',
    originalColors: false,
  }, {
    value: 'text',
    label: 'Text',
  }, {
    value: 'disabled',
    label: 'Disabled',
    type: 'checkbox',
  }
]

export const seatClassName = 'svg-seat'
export const activeSeatClassName = 'active'
export const labelClass = 'ant-col ant-form-item-label'