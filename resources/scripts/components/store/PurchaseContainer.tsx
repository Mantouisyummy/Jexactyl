import tw from 'twin.macro';
import { breakpoint } from '@/theme';
import styled from 'styled-components/macro';
import { useStoreState } from '@/state/hooks';
import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import ContentBox from '@/components/elements/ContentBox';
import { getResources, Resources } from '@/api/store/getResources';
import PageContentBlock from '@/components/elements/PageContentBlock';
import StripePurchaseForm from '@/components/store/forms/StripePurchaseForm';
import PaypalPurchaseForm from '@/components/store/forms/PaypalPurchaseForm';

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
    const [resources, setResources] = useState<Resources>();
    const earn = useStoreState((state) => state.storefront.data!.earn);
    const paypal = useStoreState((state) => state.storefront.data!.gateways?.paypal);
    const stripe = useStoreState((state) => state.storefront.data!.gateways?.stripe);

    useEffect(() => {
        getResources().then((resources) => setResources(resources));
    }, []);

    if (!resources) return <Spinner size={'large'} centered />;

    return (
        <PageContentBlock title={'帳戶餘額'} description={'可以輕鬆通過Stripe或PayPal購買積分.'}>
            <Container className={'lg:grid lg:grid-cols-2 my-10'}>
                <ContentBox title={'帳戶餘額'} showFlashes={'account:balance'} css={tw`sm:mt-0`}>
                    <h1 css={tw`text-7xl flex justify-center items-center`}>
                        {resources.balance} <span className={'text-base ml-4'}>點積分</span>
                    </h1>
                </ContentBox>
                <ContentBox title={'Purchase credits'} showFlashes={'account:balance'} css={tw`mt-8 sm:mt-0 sm:ml-8`}>
                    {!paypal && !stripe ? (
                        <p className={'text-gray-400 text-sm text-center'}>
                            目前無法使用支付服務.
                        </p>
                    ) : (
                        <>
                            {paypal && <PaypalPurchaseForm />}
                            {stripe && <StripePurchaseForm />}
                        </>
                    )}
                </ContentBox>
            </Container>
            {earn.enabled && (
                <>
                    <h1 className={'text-5xl'}>閒置積分效益</h1>
                    <h3 className={'text-2xl text-neutral-500'}>
                        查看你在閒置時獲得了多少積分/每分鐘.
                    </h3>
                    <Container className={'lg:grid lg:grid-cols-2 my-10'}>
                        <ContentBox title={'賺取效率'} showFlashes={'earn:rate'} css={tw`sm:mt-0`}>
                            <h1 css={tw`text-7xl flex justify-center items-center`}>
                                {earn.amount} <span className={'text-base ml-4'}>積分 / 每分鐘</span>
                            </h1>
                        </ContentBox>
                        <ContentBox
                            title={'如何賺取'}
                            showFlashes={'earn:how'}
                            css={tw`mt-8 sm:mt-0 sm:ml-8 text-gray-300`}
                        >
                            <p>您可以在開啟面板頁面的任何時候賺取積分</p>
                            <p css={tw`mt-1`}>
                                <span css={tw`text-green-500`}>{earn.amount}&nbsp;</span>
                                點積分每分鐘會自動添加到您的帳戶中，當開啟面板任何頁面於瀏覽器時.
                            </p>
                        </ContentBox>
                    </Container>
                </>
            )}
        </PageContentBlock>
    );
};
