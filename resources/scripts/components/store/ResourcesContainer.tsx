import tw from 'twin.macro';
import { breakpoint } from '@/theme';
import * as Icon from 'react-feather';
import { Link } from 'react-router-dom';
import useFlash from '@/plugins/useFlash';
import styled from 'styled-components/macro';
import React, { useState, useEffect } from 'react';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/elements/button';
import { Dialog } from '@/components/elements/dialog';
import { getCosts, Costs } from '@/api/store/getCosts';
import purchaseResource from '@/api/store/purchaseResource';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import PurchaseBox from '@/components/elements/store/PurchaseBox';
import PageContentBlock from '@/components/elements/PageContentBlock';

const Container = styled.div`
    ${tw`flex flex-wrap`};

    & > div {
        ${tw`w-full`};

        ${breakpoint('sm')`
      width: calc(50% - 1rem);
    `}

        ${breakpoint('md')`
      ${tw`w-auto flex-1`};
    `}
    }
`;

export default () => {
    const [open, setOpen] = useState(false);
    const [costs, setCosts] = useState<Costs>();
    const [resource, setResource] = useState('');
    const { addFlash, clearFlashes, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        getCosts().then((costs) => setCosts(costs));
    }, []);

    const purchase = (resource: string) => {
        clearFlashes('store:resources');

        purchaseResource(resource)
            .then(() => {
                setOpen(false);
                addFlash({
                    type: 'success',
                    key: 'store:resources',
                    message: '購買成功!',
                });
            })
            .catch((error) => clearAndAddHttpError({ key: 'store:resources', error }));
    };

    if (!costs) return <Spinner size={'large'} centered />;

    return (
        <PageContentBlock
            title={'購買資源'}
            description={'購買更多資源以升級你的伺服器.'}
            showFlashKey={'store:resources'}
        >
            <SpinnerOverlay size={'large'} visible={open} />
            <Dialog.Confirm
                open={open}
                onClose={() => setOpen(false)}
                title={'確認資源選擇'}
                confirm={'繼續'}
                onConfirmed={() => purchase(resource)}
            >
                你真的確定你要購買 ({resource}) 嗎? 這將會透過你帳戶的積分兌換並增加資源. 此交易不可逆.
            </Dialog.Confirm>
            <Container className={'lg:grid lg:grid-cols-4 my-10 gap-8'}>
                <PurchaseBox
                    type={'CPU'}
                    amount={50}
                    suffix={'%'}
                    cost={costs.cpu}
                    setOpen={setOpen}
                    icon={<Icon.Cpu />}
                    setResource={setResource}
                    description={'購買CPU以提升伺服器的載入時間和效能.'}
                />
                <PurchaseBox
                    type={'Memory'}
                    amount={1}
                    suffix={'GB'}
                    cost={costs.memory}
                    setOpen={setOpen}
                    icon={<Icon.PieChart />}
                    setResource={setResource}
                    description={'購買記憶體以提升整體伺服器效能.'}
                />
                <PurchaseBox
                    type={'Disk'}
                    amount={1}
                    suffix={'GB'}
                    cost={costs.disk}
                    setOpen={setOpen}
                    icon={<Icon.HardDrive />}
                    setResource={setResource}
                    description={'購買容量以儲存更多檔案.'}
                />
                <PurchaseBox
                    type={'Slots'}
                    amount={1}
                    cost={costs.slots}
                    setOpen={setOpen}
                    icon={<Icon.Server />}
                    setResource={setResource}
                    description={'購買伺服器槽位以讓您可以增加新伺服器.'}
                />
            </Container>
            <Container className={'lg:grid lg:grid-cols-4 my-10 gap-8'}>
                <PurchaseBox
                    type={'Ports'}
                    amount={1}
                    cost={costs.ports}
                    setOpen={setOpen}
                    icon={<Icon.Share2 />}
                    setResource={setResource}
                    description={'購買一個網路端口添加至伺服器.'}
                />
                <PurchaseBox
                    type={'Backups'}
                    amount={1}
                    cost={costs.backups}
                    setOpen={setOpen}
                    icon={<Icon.Archive />}
                    setResource={setResource}
                    description={'購買備份以確保您的資料安全.'}
                />
                <PurchaseBox
                    type={'Databases'}
                    amount={1}
                    cost={costs.databases}
                    setOpen={setOpen}
                    icon={<Icon.Database />}
                    setResource={setResource}
                    description={'購買資料庫以抓取和寫入資料.'}
                />
                <TitledGreyBox title={'如何使用資源'}>
                    <p className={'font-semibold'}>添加至已有的伺服器</p>
                    <p className={'text-xs text-gray-500'}>
                        如果您已經擁有了一台伺服器，您可以前往 &apos;編輯&apos; 頁面來添加資源.
                    </p>
                    <p className={'font-semibold mt-1'}>添加至全新的伺服器</p>
                    <p className={'text-xs text-gray-500'}>
                        您可以在建立伺服器的頁面上購買資源並將它們添加到新的伺服器中，可透過商店存取該頁面.
                    </p>
                </TitledGreyBox>
            </Container>
            <div className={'flex justify-center items-center'}>
                <div className={'bg-auto bg-center bg-storeone p-4 m-4 rounded-lg'}>
                    <div className={'text-center bg-gray-900 bg-opacity-75 p-4'}>
                        <h1 className={'text-4xl'}>準備好開始了嗎?</h1>
                        <Link to={'/store/create'}>
                            <Button.Text className={'w-full mt-4'}>建立伺服器</Button.Text>
                        </Link>
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};
