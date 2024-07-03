import tw from 'twin.macro';
import * as React from 'react';
import { breakpoint } from '@/theme';
import styled from 'styled-components/macro';
import { useStoreState } from '@/state/hooks';
import { useLocation } from 'react-router-dom';
import Alert from '@/components/elements/alert/Alert';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import DiscordAccountForm from '@/components/dashboard/forms/DiscordAccountForm';
import UpdateUsernameForm from '@/components/dashboard/forms/UpdateUsernameForm';
import AddReferralCodeForm from '@/components/dashboard/forms/AddReferralCodeForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';

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
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();
    const discord = useStoreState((state) => state.settings.data!.registration.discord);
    const referrals = useStoreState((state) => state.storefront.data!.referrals.enabled);

    return (
        <PageContentBlock title={'帳戶總覽'} description={'查看以及更新帳戶資訊.'}>
            {state?.twoFactorRedirect && (
                <Alert type={'danger'}>
                    您的帳戶必須啟用2FA (雙重身份驗證) 才能繼續。
                </Alert>
            )}
            <Container
                className={'j-up'}
                css={[tw`lg:grid lg:grid-cols-2 gap-8 mb-10`, state?.twoFactorRedirect ? tw`mt-4` : tw`mt-10`]}
            >
                <ContentBox title={'更新用戶名稱'} showFlashes={'account:username'}>
                    <UpdateUsernameForm />
                </ContentBox>
                <ContentBox title={'更新電郵'} showFlashes={'account:email'}>
                    <UpdateEmailAddressForm />
                </ContentBox>
                {referrals && (
                    <ContentBox title={'推薦碼'} showFlashes={'account:referral'}>
                        <AddReferralCodeForm />
                    </ContentBox>
                )}
                {discord && (
                    <ContentBox title={'連接至Discord'} showFlashes={'account:discord'}>
                        <DiscordAccountForm />
                    </ContentBox>
                )}
            </Container>
        </PageContentBlock >
    );
};
