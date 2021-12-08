import React, { useMemo, useState } from 'react';
import { Row, Button, Modal, ButtonProps } from 'antd';
import { ArtCard } from './../../components/ArtCard';
import { useUserArts } from '../../hooks';
import { SafetyDepositDraft } from '../../actions/createAuctionManager';

export interface ArtSelectorProps extends ButtonProps {
  selected: SafetyDepositDraft[];
  setSelected: (selected: SafetyDepositDraft[]) => void;
  allowMultiple: boolean;
  filter?: (i: SafetyDepositDraft) => boolean;
}

export const ArtSelector = (props: ArtSelectorProps) => {
  const { selected, setSelected, allowMultiple, ...rest } = props;
  let items = useUserArts();
  if (props.filter) items = items.filter(props.filter);
  const selectedItems = useMemo<Set<string>>(
    () => new Set(selected.map(item => item.metadata.pubkey)),
    [selected],
  );

  const [visible, setVisible] = useState(false);

  const open = () => {
    clear();

    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const clear = () => {
    setSelected([]);
  };

  const confirm = () => {
    close();
  };

  return (
    <>
      <div className="artwork-grid">
        {selected.map(m => {
          let key = m?.metadata.pubkey || '';

          return (
            <ArtCard
              key={key}
              pubkey={m.metadata.pubkey}
              preview={false}
              onClick={open}
              close={() => {
                setSelected(selected.filter(_ => _.metadata.pubkey !== key));
                confirm();
              }}
            />
          );
        })}
        {(allowMultiple || selectedItems.size === 0) && (
          <div
            className="ant-card ant-card-bordered ant-card-hoverable art-card"
            style={{ width: 200, height: 300, display: 'flex' }}
            onClick={open}
          >
            <span className="text-center">Add an NFT</span>
          </div>
        )}
      </div>

      <Modal
        visible={visible}
        onCancel={close}
        onOk={confirm}
        width={1100}
        footer={null}
        className={"modalp-40"}
      >
        <Row className="call-to-action" style={{ marginBottom: 0 }}>
          <h2>Select the NFT you want to sell</h2>
          <p style={{ fontSize: '1.2rem' }}>
            Select the NFT that you want to sell copy/copies of.
          </p>
        </Row>
        <Row
          className="content-action"
          style={{ overflowY: 'auto', height: '50vh' }}
        >
          <div className="artwork-grid">
            {items.map(m => {
              const id = m.metadata.pubkey;
              const isSelected = selectedItems.has(id);

              const onSelect = () => {
                let list = [...selectedItems.keys()];
                if (allowMultiple) {
                  list = [];
                }

                const newSet = isSelected
                  ? new Set(list.filter(item => item !== id))
                  : new Set([...list, id]);

                let selected = items.filter(item =>
                  newSet.has(item.metadata.pubkey),
                );
                setSelected(selected);

                if (!allowMultiple) {
                  confirm();
                }
              };

              return (
                <ArtCard
                  key={id}
                  pubkey={m.metadata.pubkey}
                  preview={false}
                  onClick={onSelect}
                  className={isSelected ? 'selected-card art-card-for-selector' : 'not-selected-card art-card-for-selector'}
                />
              );
            })}
          </div>
        </Row>
        <Row>
          <Button
            type="primary"
            size="large"
            onClick={confirm}
            className="action-btn"
          >
            Confirm
          </Button>
        </Row>
      </Modal>
    </>
  );
};
