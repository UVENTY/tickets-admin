import { Skeleton } from 'antd'

export default function FormSkeleton() {
  const renderRow = () => (<div style={{ display: 'flex' }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div style={{ width: i < 3 ? 200 : 'auto', flex: i < 3 ? '0 0 200px' : '1 1 auto', padding: 3 }}>
        <Skeleton.Button key={i} style={{ height: 35, margin: 3 }} active block />
      </div>
    ))}
  </div>)

  return (
    <div>
      <Skeleton.Button active style={{ height: 60, marginBottom: 30 }} block />
      <FormSkeleton.FieldsetTitle />
      <div style={{ display: 'flex' }}>
        <div style={{ flex: '0 0 25%' }}>
          <FormSkeleton.Label width={75} />
        </div>
        <div style={{ flex: '0 0 25%' }}>
          <FormSkeleton.Label width={45} />
        </div>
        <div>
          <FormSkeleton.Label width={75} />
        </div>
      </div>
      <div style={{ display: 'flex', marginBottom: 40 }}>
        <div style={{ flex: '0 0 50%', padding: 3 }}>
          <FormSkeleton.Input />
        </div>
        <div style={{ flex: '0 0 50%', padding: 3 }}>
          <FormSkeleton.Input />
        </div>
      </div>
      <FormSkeleton.FieldsetTitle />
      <Skeleton.Button active style={{ height: 190 }} block />
      <FormSkeleton.FieldsetTitle />
      {Array.from({ length: 4 }).map((_, i) => <div key={i}>
        {renderRow()}
      </div>)}
    </div>
  )
}

FormSkeleton.FieldsetTitle = () => (<Skeleton.Button style={{ height: 25, margin: '16px 0' }} active block />)
FormSkeleton.Label = ({ width }) => (<Skeleton.Button style={{ height: 16, margin: '12px 0', width }} active block />)
FormSkeleton.Input = () => (<Skeleton.Button style={{ height: 40, }} active block />)