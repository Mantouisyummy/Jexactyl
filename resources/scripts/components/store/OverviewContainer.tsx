import React from 'react';
import { useStoreState } from 'easy-peasy';
import useWindowDimensions from '@/plugins/useWindowDimensions';
import ResourceBar from '@/components/elements/store/ResourceBar';
import StoreBanner from '@/components/elements/store/StoreBanner';
import PageContentBlock from '@/components/elements/PageContentBlock';

export default () => {
    const { width } = useWindowDimensions();
    const username = useStoreState((state) => state.user.data!.username);

    return (
        <PageContentBlock title={'Storefront Overview'}>
            <div className={'flex flex-row items-center justify-between mt-10'}>
                {width >= 1280 && (
                    <div>
                        <h1 className={'text-6xl'}>嘿, {username}!</h1>
                        <h3 className={'text-2xl mt-2 text-neutral-500'}>👋 歡迎來到商店.</h3>
                    </div>
                )}
                <ResourceBar className={'w-full lg:w-3/4'} />
            </div>
            <div className={'lg:grid lg:grid-cols-3 gap-8 my-10'}>
                <StoreBanner
                    title={'想要創建伺服器?'}
                    className={'bg-storeone'}
                    action={'建立'}
                    link={'create'}
                />
                <StoreBanner
                    title={'需要更多資源?'}
                    className={'bg-storetwo'}
                    action={'購買資源'}
                    link={'resources'}
                />
                <StoreBanner
                    title={'沒有積分了?'}
                    className={'bg-storethree'}
                    action={'購買積分'}
                    link={'credits'}
                />
            </div>
        </PageContentBlock>
    );
};
